###############
##  IMPORTS  ##
###############

from datetime import datetime
from pprint import pprint
import MySQLdb.cursors
import numpy as np
import unicodedata
import requests
import MySQLdb
import random
import time
import json
import copy
import ast
import sys
import re
import os

#################
##  FUNCTIONS  ##
#################

def create_tables(table, helpers):
	if table == 'user_table':
		sql = """
			CREATE TABLE """ + helpers[table] + """
			(
				user varchar(256),
				created_date timestamp
			)
		"""
	if table == 'user_income_table':
		sql = """
			CREATE TABLE """ + helpers[table] + """
			(
				user varchar(256),
				stream varchar(256),
				apr float,
				current_amount float,
				low_estimate_deposit float,
				high_estimate_deposit float
			)
		"""
	helpers['cur'].execute(sql)
	helpers['con'].commit()
	print('created table: ' + helpers[table])
	return

def existing_user_data(helpers):
	existing_user_streams = {}
	for table in ['user_table', 'user_income_table']:
		sql = "SELECT * FROM " + helpers[table]
		try: helpers['cur'].execute(sql)
		except:
			create_tables(table, helpers)
			helpers['cur'].execute(sql)
		if table == 'user_income_table':
			rows = helpers['cur'].fetchall()
	for row in rows:
		if row['user'] not in existing_user_streams: existing_user_streams[row['user']] = {}
		existing_user_streams[row['user']][row['stream']] = 1
	return existing_user_streams

def add_new_user_streams(existing_user_streams, users, helpers):
	output = []
	cols = ['apr', 'current_amount', 'low_estimate_deposit', 'high_estimate_deposit']
	for user in users:
		for stream in users[user]:
			if user in existing_user_streams:
				if stream in existing_user_streams[user]: continue
			row = ("'" + "'~~~'".join([user, stream]) + "'").split('~~~')
			row = row + [ str(users[user][stream][cols[i]]) for i in range(0,len(cols)) ]
			output.append(', '.join(row))
	if len(output) > 0:
		sql = """
			INSERT INTO """ + helpers['user_income_table'] + """
			(user, stream, """ + ', '.join(cols) + """)
			VALUES (""" + '), ('.join(output) + """)
		"""
		helpers['cur'].execute(sql)
		helpers['con'].commit()
		print('inserted rows: ' + str(len(output)))
	return

############
##  MAIN  ##
############

with open('inputs.json') as f: users = json.load(f)
with open('/root/config_files/databases.conf') as f: conf = json.load(f)['tracker']
con = MySQLdb.connect(
	host=conf['host'], 
	user=conf['user'], 
	passwd=conf['passwd'], 
	db=conf['db'],
	cursorclass=MySQLdb.cursors.DictCursor
)
helpers = {
        'user_table': 'tracker.users',
	'user_income_table': 'tracker.users_income_streams',
        'con': con,
        'cur': con.cursor()
}

existing_user_streams = existing_user_data(helpers)

add_new_user_streams(existing_user_streams, users, helpers)

#pprint(users)
