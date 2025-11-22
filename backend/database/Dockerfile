FROM postgres:15-alpine

COPY init.sh /docker-entrypoint-initdb.d/00-init.sh
COPY migrations /docker-entrypoint-initdb.d/migrations
COPY seeds /docker-entrypoint-initdb.d/seeds

RUN chmod +x /docker-entrypoint-initdb.d/00-init.sh
