#!/bin/sh
# Render provides DATABASE_URL as postgres://user:pass@host:port/db
# Spring Boot needs jdbc:postgresql://user:pass@host:port/db
if [ -n "$DATABASE_URL" ]; then
  JDBC_URL="jdbc:postgresql${DATABASE_URL#postgres}"
  echo "INFO: Converted DATABASE_URL to JDBC format: $JDBC_URL"
  exec java \
    -DSPRING_DATASOURCE_URL="$JDBC_URL" \
    -Dspring.datasource.url="$JDBC_URL" \
    -jar /app/app.jar
else
  echo "INFO: No DATABASE_URL found, using application.properties defaults"
  exec java -jar /app/app.jar
fi
