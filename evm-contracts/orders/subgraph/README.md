# Subgraph for the LoanContract contract

## Setup a local graph node

- `git clone git@github.com:graphprotocol/graph-node.git`
- `cd graph-node/docker`
- Edit docker-compose to use ESC node: `ethereum: 'mainnet:https://api.elastos.io/esc esc-staging:https://api.elastos.io/esc esc-prod:https://api.elastos.io/esc' # 'mainnet:http://host.docker.internal:8545'`
- Start the local node: `docker-compose up`

When deploying a graph locally, sync logs can be see in that docker console.

## Generate the contracts

- Setup the project root (hardhat) and **compile the contracts**
- Then from this folder: `yarn` or `npm i -D`

## Deploy locally

- `yarn codegen`
- `yarn build --network esc-staging`
- `yarn create-local` (first time only)
- `yarn deploy-local` (go to local graph node console to check sync progress)

## Local playground

- Open `http://localhost:8000/subgraphs/name/bel2-loan/graphql` to test graphql queries

## Deploy to production

`yarn codegen`
`yarn build --network esc-prod` or `yarn build --network esc-staging`

`graph deploy --ipfs https://graphnode-ipfs.filda.io --node https://graphnode-deploy.filda.io/ bel2-loan-esc-prod`
or
`graph deploy --ipfs https://graphnode-ipfs.filda.io --node https://graphnode-deploy.filda.io/ bel2-loan-esc-staging`

## Debug produced data in database

- `docker ps`
- `docker exec -it <containerid> bash`
- `psql -U graph-node`
- `SELECT * FROM "sgd10"."order" order by "created_at" desc;`