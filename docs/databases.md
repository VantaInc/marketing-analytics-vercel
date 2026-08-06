# Supported Databases

Use this when an internal app needs persistent storage.

The source-of-truth Guru card is
[Databases](https://app.getguru.com/card/cALge8gi/Databases).

## CPD Policy

Do not store CPD in any database or storage service provisioned for apps from
this template. None of the supported options below are approved for CPD.

If your app needs to store CPD, stop and use a different approved data path
before adding persistence.

## Supported Options

Provision supported storage from the
[Vercel Console stores page](https://vercel.com/vantacom/~/stores).

| Paradigm         | Vendor               | Name                                                                                                           | Provisioning Link                                      | Approved for CPD? |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| Blob             | Vercel               | [Blob Storage](https://vercel.com/docs/vercel-blob)                                                            | [Vercel Console](https://vercel.com/vantacom/~/stores) | NO                |
| Key-Value        | Vercel               | [Edge Config](https://vercel.com/docs/edge-config)                                                             | [Vercel Console](https://vercel.com/vantacom/~/stores) | NO                |
| Key-Value        | AWS (Vercel Console) | [DynamoDB](https://aws.amazon.com/dynamodb/)                                                                   | [Vercel Console](https://vercel.com/vantacom/~/stores) | NO                |
| Relational (SQL) | AWS (Vercel Console) | [Aurora DSQL](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/what-is-aurora-dsql.html)               | [Vercel Console](https://vercel.com/vantacom/~/stores) | NO                |
| Relational (SQL) | AWS (Vercel Console) | [Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html) | [Vercel Console](https://vercel.com/vantacom/~/stores) | NO                |

Do not add a new database vendor to an app or shared package unless this table
has been updated first.

## Where To Document App Storage

When an app adds persistence:

- Add the chosen store and environment variables to `apps/<app-name>/README.md`.
- Add placeholder variable names to `apps/<app-name>/.env.example`.
- Keep real credentials in Vercel environment variables or `.env.local`.
- Note that the store is not approved for CPD.
