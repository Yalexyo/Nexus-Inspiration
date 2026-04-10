FROM nginx:alpine
RUN apk add --no-cache openssl
COPY nginx.conf /etc/nginx/nginx.conf
COPY generate-cert.sh /docker-entrypoint-generate-cert.sh
RUN chmod +x /docker-entrypoint-generate-cert.sh
CMD ["/docker-entrypoint-generate-cert.sh"]
