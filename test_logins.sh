#!/bin/bash

# Path to Login Data
LOGIN_DATA="/home/khanhromvn/Documents/Coding/Zentri - Account Manager/temp/thienbaovn2468@gmail.com/Default/Login Data"
TEMP_DB="/tmp/chrome_test_logins.db"

echo "Checking if Login Data exists..."
if [ -f "$LOGIN_DATA" ]; then
    echo "File found. Copying to temp location..."
    cp "$LOGIN_DATA" "$TEMP_DB"
    
    echo "Querying logins table..."
    sqlite3 "$TEMP_DB" "SELECT origin_url, username_value FROM logins WHERE blacklisted_by_user = 0;"
    
    echo "-------------------"
    echo "Cleaning up..."
    rm "$TEMP_DB"
else
    echo "Error: Login Data not found at $LOGIN_DATA"
fi
