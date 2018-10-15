###############
##  IMPORTS  ##
###############

from urllib.parse import unquote
from pprint import pprint
import MySQLdb.cursors
import pandas as pd
import numpy as np
import requests
import MySQLdb
import time
import json
import sys
import os

#################
##  FLASK APP  ##
#################

with open('/root/config_files/databases.conf') as f: conf = json.load(f)['tracker']
con = MySQLdb.connect(
        host=conf['host'],
        user=conf['user'],
        passwd=conf['passwd'],
        db=conf['db'],
        cursorclass=MySQLdb.cursors.DictCursor
)

import flask
app = flask.Flask(__name__)

@app.route("/")
def hello():
	return flask.render_template('index.html')

@app.route("/loadinputs/", methods=['POST'])
def load_data():
	cur = con.cursor()
	inputs = {}
	sql = " SELECT * FROM tracker.users_income_streams "
	cur.execute(sql)
	rows = cur.fetchall()
	for row in rows:
		if row['user'] not in inputs: inputs[row['user']] = {}
		inputs[row['user']][row['stream']] = row
	documents = inputs
	response = flask.jsonify(documents)
	response.headers.add('Access-Control-Allow-Origin', '*')
	cur.close()
	return response

@app.route("/refreshfile/", methods=['POST'])
def refresh_file():
	data = flask.request.form.to_dict()
	data_formatted = {}
	for x in data:
		key_outer, key_inner = x.replace('series[', '')[:-1].split('][')
		key_inner = key_inner.split('-')
		key_inner = key_inner[0] + ''.join((2-len(key_inner[1]))*['0']) + key_inner[1] + ''.join((2-len(key_inner[2]))*['0']) + key_inner[2]
		if key_outer not in data_formatted: data_formatted[key_outer] = {}
		data_formatted[key_outer][key_inner] = data[x]
	cols = [ x for x in data_formatted ]
	dates = sorted([ x for x in data_formatted[cols[0]] ], reverse=False)
	output_data = [['date'] + [ cols[i] for i in range(0,len(cols)) ]]
	for d in dates:
		output_data.append([d])
		for i in range(0,len(cols)): output_data[-1].append(data_formatted[cols[i]][d])
	f = open('static/line_data.tsv', 'w')
	for i in range(0,len(output_data)): f.write('\t'.join(output_data[i]) + '\n')
	f.close()
	response = flask.jsonify({})
	response.headers.add('Access-Control-Allow-Origin', '*')
	return response

if __name__ == "__main__":
	if sys.argv[1] == 'test': app.run()
	if sys.argv[1] == 'prod': app.run(host= '0.0.0.0')
