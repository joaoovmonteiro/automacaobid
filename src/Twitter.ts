import { TwitterApi } from "twitter-api-v2";
import { Atleta } from "./typings";
import { formatDate } from "./utils";

export async function postTweet(atleta: Atleta, card: Buffer, client: TwitterApi) {
    const nome_limpo = atleta["nome"].replaceAll(" ", "");
    const clube_tag = atleta["clube"].replaceAll(" ", "");

    let tweet_texto = `Jogador publicado no BID: ${atleta.nome}

Publicado em: ${formatDate(new Date(atleta.data_publicacao), true)}

Tipo de contrato: ${atleta.tipocontrato}`;
    if (atleta.datatermino) {
        tweet_texto += `
            
Data de término do contrato: ${formatDate(new Date(atleta.datatermino), false)}`;
    }

    tweet_texto += `

#${nome_limpo} #BID #${clube_tag}`;

    const id = await client.v1.uploadMedia(card, { mimeType: "png" });
    await client.v2.tweet(tweet_texto, { media: { media_ids: [id] } });
    console.log(`Tweet posted for athlete: ${atleta.nome}`);
}
