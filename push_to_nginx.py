# Imports
from shutil import copyfile, rmtree
import sys
import os

# Main
out_dir = '/var/www/bubbletease.me'
file_dirs = ['', 'templates', 'static']
for f_dir in file_dirs:
	if f_dir == '': 
		files = os.listdir(os.getcwd())
	else: 
		files = os.listdir(os.path.join(os.getcwd(),f_dir))
		out_subdir = os.path.join(out_dir,f_dir)
		if os.path.isdir(out_subdir) == True: rmtree(out_subdir)
		os.mkdir(out_subdir)
	for f in files:
		for suffix in ['.html', '.js', '.css', '.json', 'api_calls.py']:
			if suffix in f:
				copyfile(os.path.join(f_dir,f), os.path.join(out_dir,f_dir,f))
				break

