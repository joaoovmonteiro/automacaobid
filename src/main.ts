import { config } from "dotenv";
config();
export const ENV = process.env as any;
import { TwitterApi } from "twitter-api-v2";

const teams = Object.keys(ENV)
    .filter((key) => key.startsWith("TEAM_") && key.endsWith("_CODE"))
    .map((key) => {
        const teamIndex = key.split("_")[1];
        return {
            uf: ENV[`TEAM_${teamIndex}_UF`],
            code: ENV[key],
            appKey: ENV[`TWITTER_ACCOUNT_${teamIndex}_API_KEY`],
            appSecret: ENV[`TWITTER_ACCOUNT_${teamIndex}_SECRET`],
            accessToken: ENV[`TWITTER_ACCOUNT_${teamIndex}_ACCESS_TOKEN`],
            accessSecret: ENV[`TWITTER_ACCOUNT_${teamIndex}_ACCESS_SECRET`],
            client: new TwitterApi({
                appKey: ENV[`TWITTER_ACCOUNT_${teamIndex}_API_KEY`],
                appSecret: ENV[`TWITTER_ACCOUNT_${teamIndex}_SECRET`],
                accessToken: ENV[`TWITTER_ACCOUNT_${teamIndex}_ACCESS_TOKEN`],
                accessSecret: ENV[`TWITTER_ACCOUNT_${teamIndex}_ACCESS_SECRET`],
            }),
        };
    });

import Bid from "./Bid";
import { postTweet } from "./Twitter";
import { CronJob } from "cron";

const bid = new Bid();

const job = CronJob.from({
    cronTime: "0 */10 8-19 * * 1-5", // Every 10 minutes from 8 AM to 7 PM, Monday to Friday
    onTick: async function () {
        bid.cleanCache();
        console.log("Running scheduled task...");
        for (const team of teams) {
            try {
                console.log(`Fetching bids for team: ${team.code}`);

                const bids = await bid.getBids({
                    data: new Date().toLocaleDateString("pt-BR"),
                    uf: team.uf,
                    codigo_clube: team.code,
                });
                console.log(`Found ${bids.length} bids for team: ${team.code} - ${team.uf}`);
                for (const atleta of bids) {
                    try {
                        const key = {
                            data: new Date().toLocaleDateString("pt-BR"),
                            uf: team.uf,
                            codigo_clube: team.code,
                            atleta_id: atleta.codigo_atleta,
                            tipo_contrato: atleta.tipocontrato,
                            contrato_numero: atleta.contrato_numero,
                        };

                        if (await bid.checkKeyExists(key)) {
                            console.log(`Tweet already posted for athlete: ${atleta.nome} - Contract: ${atleta.tipocontrato} #${atleta.contrato_numero}`);
                            continue;
                        }

                        console.log(`Processing athlete: ${atleta.nome} - Contract: ${atleta.tipocontrato} #${atleta.contrato_numero}`);
                        const card = await bid.buildCard(atleta);
                        console.log(`Posting tweet for athlete: ${atleta.nome}`);
                        await postTweet(atleta, Buffer.from(card), team.client);

                        //need to save that the tweet was posted today, so we don't post it again
                        await bid.saveTweet(key);
                    } catch (error) {
                        console.error(`Error processing athlete ${atleta.nome}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error processing team ${team.code}:`, error);
            }
        }
    },
    start: true,
    timeZone: "America/Sao_Paulo",
    runOnInit: true,
});
