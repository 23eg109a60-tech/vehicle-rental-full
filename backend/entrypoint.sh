#!/bin/sh
# Render provides DATABASE_URL as postgres://user:pass@host:port/db
# Spring Boot needs jdbc:postgresql://user:pass@host:port/db
if [ -n "$DATABASE_URL" ]; then
  export SPRING_DATASOURCE_URL="jdbc:postgresql${DATABASE_URL#postgres}"
  echo "INFO: Converted DATABASE_URL to JDBC format"
fi
exec java -jar /app/app.jar
