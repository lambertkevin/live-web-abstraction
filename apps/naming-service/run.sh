apt-get update -y && apt-get install -y openssl curl

if [ -f .keys/ns.pk ]; then
    echo 'Keys already set'
else
    openssl genrsa -out .keys/ns.sk 4096
    openssl rsa -in .keys/ns.sk -pubout > .keys/ns.pk
fi

npm i
npm exec prisma generate
npm exec prisma migrate dev
npm exec prisma db pull
npm run dev