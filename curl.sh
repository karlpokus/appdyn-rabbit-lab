#!/bin/bash

# wait for http to be up
sleep 2

while true; do
	curl -s http://localhost:5005
	echo "request sent"
	sleep 5
done
