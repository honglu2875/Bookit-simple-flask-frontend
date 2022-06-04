#!/bin/bash
help()
{
	echo "Please supply the following environment variable(s):"
	echo "EMAIL: your email"
}

if [[ -z "${EMAIL}" ]]; then
	help
	exit 0
fi

while [ -n "$1" ]; do
	case "$1" in
		-r) 
			cp app.py.backup app.py
			exit 0
			;;
		*) echo "Option $1 not recognized.";;
	esac
	shift
done

cp app.py app.py.backup
sed -i "s/<EMAIL>/${EMAIL}/g" app.py
