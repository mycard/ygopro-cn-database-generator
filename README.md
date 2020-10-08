# ygopro-cn-database-generator

[![pipeline status](https://code.mycard.moe/mycard/ygopro-cn-database-generator/badges/master/pipeline.svg)](https://code.mycard.moe/mycard/ygopro-cn-database-generator/-/commits/master)

Generates CN env database from NWBBS posts.

## How to use

1. `npm ci && npm run build`

2. `git clone https://code.mycard.moe/mycard/ygopro-database ygopro-database`

3. `npm run start`

4.  Pick the output database from `output/cards.cdb` .

## Configurations

By default, configurations are not needed for default settings. Configurations are done by env vars as follows.

* `POST_DEPTH` How many pages it would read in the homepage of NWBBS.

* `CN_DATABASE_PATH` `JP_DATABASE_PATH` Japanese and Chinese database path.

* `OUTPUT_PATH` Output path.
