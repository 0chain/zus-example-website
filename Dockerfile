FROM nginx:1.23.3-alpine
COPY . /var/www/
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["nginx","-g","daemon off;"]
