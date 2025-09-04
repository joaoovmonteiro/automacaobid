import { Solver } from "@2captcha/captcha-solver";
import { ENV } from "./main";
import axios from "axios";
import fs from "fs";
import { criarCardAtleta } from "./card";
import { Atleta } from "./typings";
const solver = new Solver(ENV.TWOCAPTCHA_API_KEY);

const instance = axios.create({
    withCredentials: true,
});

const cacheFile = "persistent/cache.json";
const sessionFile = "persistent/session.json";
if (!fs.existsSync("persistent")) {
    fs.mkdirSync("persistent");
}
export default class Bid {
    private CRSF: string | null = null;
    private captcha: string | null = null;

    constructor() {
        if (fs.existsSync(sessionFile)) {
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
            this.CRSF = sessionData.CRSF || null;
            this.captcha = sessionData.captcha || null;
            instance.defaults.headers.Cookie = sessionData.cookies || "";
        }
    }

    async init() {
        console.log("Initializing Bid session...");
        const response = await instance.get("https://bid.cbf.com.br/");
        instance.defaults.headers.Cookie = response.headers["set-cookie"]?.join("; ") || "";
        const data = response.data;
        const match = data.match(/<meta name="csrf-token" content="(.+?)">/);
        if (match && match[1]) {
            this.CRSF = match[1];
        } else {
            throw new Error("CSRF token not found");
        }
        await this.captchaSetup();
    }

    async captchaSetup() {
        const response = await instance.get("https://bid.cbf.com.br/get-captcha-base64");
        const answer = await solver.imageCaptcha({
            body: response.data,
            phrase: 0,
            regsense: 0,
            numeric: 2,
        });
        this.captcha = answer.data;
        console.log("Captcha solved:", this.captcha);
        fs.writeFileSync(
            sessionFile,
            JSON.stringify({
                CRSF: this.CRSF,
                captcha: this.captcha,
                cookies: instance.defaults.headers.Cookie || "",
                timestamp: new Date().toISOString(),
            }),
            "utf8"
        );
    }

    async getBids(data: { data: string; uf: string; codigo_clube: string }, retryCount: number = 0): Promise<Atleta[]> {
        const maxRetries = 3;
        
        if (!this.CRSF || !this.captcha) {
            await this.init();
        }

        try {
            const response = await instance.post<Atleta[]>(
                "https://bid.cbf.com.br/busca-json",
                { ...data, captcha: this.captcha },
                {
                    headers: {
                        "X-CSRF-Token": this.CRSF,
                    },
                }
            );
            
            // Verificar se a resposta é válida
            if (!response.data || response.data === undefined) {
                console.error("Invalid response from BID API, likely captcha error");
                throw new Error("Invalid response - captcha may be incorrect");
            }
            
            // Verificar se é um array
            if (!Array.isArray(response.data)) {
                console.error("Response is not an array, likely captcha error");
                throw new Error("Invalid response format - captcha may be incorrect");
            }
            
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error fetching bids:", error.response?.data || error.message);
                
                if (error?.response?.data?.message === "CSRF token mismatch.") {
                    console.error("CSRF token mismatch, reinitializing session...");
                    await this.init();
                    return this.getBids(data, retryCount); // Retry after reinitializing session
                }
            }
            
            // Se for erro de captcha ou resposta inválida e ainda temos tentativas
            if (retryCount < maxRetries) {
                console.error(`Attempt ${retryCount + 1}/${maxRetries + 1} failed, retrying with new captcha...`);
                await this.captchaSetup(); // Resolver novo captcha
                return this.getBids(data, retryCount + 1);
            }
            
            console.error(`Failed after ${maxRetries + 1} attempts`);
            throw error;
        }
    }

    async buildCard(atleta: Atleta) {
        const buffer = await criarCardAtleta(atleta);
        return buffer;
    }

    async saveTweet(tweetData: { data: string; uf: string; codigo_clube: string; atleta_id: string; tipo_contrato: string; contrato_numero: string }) {
        let cache: { [key: string]: any } = {};

        if (fs.existsSync(cacheFile)) {
            cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        }

        const key = `${tweetData.data}-${tweetData.uf}-${tweetData.codigo_clube}-${tweetData.atleta_id}-${tweetData.tipo_contrato}-${tweetData.contrato_numero}`;
        cache[key] = true;

        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf8");
        console.log(`Saved tweet data for ${key}`);
    }

    async checkKeyExists(tweetData: { data: string; uf: string; codigo_clube: string; atleta_id: string; tipo_contrato: string; contrato_numero: string }) {
        const key = `${tweetData.data}-${tweetData.uf}-${tweetData.codigo_clube}-${tweetData.atleta_id}-${tweetData.tipo_contrato}-${tweetData.contrato_numero}`;
        if (fs.existsSync(cacheFile)) {
            const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
            return key in cache;
        }
        return false;
    }

    cleanCache() {
        //remove cache older than 1 day
        if (fs.existsSync(cacheFile)) {
            const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
            const now = new Date();
            for (const key in cache) {
                const [dateStr] = key.split("-");
                if (dateStr != now.toLocaleDateString("pt-BR")) {
                    delete cache[key];
                }
            }
            fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf8");
            console.log("Cache cleaned");
        } else {
            console.log("No cache file found to clean");
        }
    }
}

