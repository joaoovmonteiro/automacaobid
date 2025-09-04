import axios from "axios";
import { Atleta } from "./typings";
import puppeteer from "puppeteer";
import { formatDate } from "./utils";

const data_termino_formatada = "";
const createHtml = async (atleta: Atleta) => {
    const foto = await axios.get(`https://bid.cbf.com.br/foto-atleta/${atleta.codigo_atleta}`, {
        responseType: "arraybuffer",
    });
    const foto_src = `data:image/png;base64,${Buffer.from(foto.data, "binary").toString("base64")}`;

    const escudo = await axios.get(`https://bid.cbf.com.br/files/clubes/${atleta.codigo_clube}/escudo.jpg`, {
        responseType: "arraybuffer",
    });
    const escudo_src = `data:image/png;base64,${Buffer.from(escudo.data, "binary").toString("base64")}`;
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; padding: 20px; min-height: 100vh; }
                .container { width: 100%; max-width: 700px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin: 0 auto; min-height: 400px; }
                .atleta-nome { font-size: 1.5rem; font-weight: bold; color: #0d6efd; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 10px; }
                .content-wrapper { display: flex; gap: 25px; align-items: flex-start; width: 100%; }
                .foto-section { flex: 0 0 220px; text-align: center; }
                .info-section { flex: 1; min-width: 0; }
                .foto-atleta { width: 200px; height: 250px; object-fit: cover; border-radius: 12px; border: 3px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .atleta-info { margin-bottom: 20px; }
                .atleta-info p { margin: 10px 0; font-size: 1rem; line-height: 1.5; display: flex; align-items: center; }
                .atleta-info .label { min-width: 130px; font-weight: normal; color: #495057; }
                .atleta-info .value { font-weight: bold; color: #212529; flex: 1; }
                .clube-section { padding-top: 15px; border-top: 2px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
                .clube-info { display: flex; align-items: center; color: #6c757d; font-size: 1rem; }
                .escudo-clube { width: 40px; height: 40px; margin-right: 12px; border-radius: 6px; object-fit: contain; }
                .btn-historico { padding: 10px 20px; border: 2px solid #0d6efd; color: #0d6efd; text-decoration: none; border-radius: 6px; background: transparent; font-weight: 500; font-size: 0.9rem; white-space: nowrap; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="atleta-nome">${atleta["nome"]}</div>
                <div class="content-wrapper">
                    <div class="foto-section">
                        <img alt="${atleta["nome"]}" class="foto-atleta" src="${foto_src}">
                    </div>
                    <div class="info-section">
                        <div class="atleta-info">
                            <p><span class="label">Nº de Contrato:</span> <span class="value">${
                                atleta["contrato_numero"]
                            }</span></p>
                            <p><span class="label">Tipo Contrato:</span> <span class="value">${
                                atleta["tipocontrato"]
                            }</span></p>
                            <p><span class="label">Publicação:</span> <span class="value">${formatDate(
                                new Date(atleta["data_publicacao"]),
                                true
                            )}</span></p>
                            ${
                                atleta["datatermino"]
                                    ? `<p><span class="label">Término:</span> <span class="value">${formatDate(
                                          new Date(atleta["datatermino"]),
                                          false
                                      )}</span></p>`
                                    : ""
                            }
                            <p><span class="label">Inscrição:</span> <span class="value">${
                                atleta["codigo_atleta"]
                            }</span></p>
                            <p><span class="label">Apelido:</span> <span class="value">${
                                atleta?.["apelido"] ?? "-"
                            }</span></p>
                            <p><span class="label">Nascimento:</span> <span class="value">${
                                atleta["data_nascimento"]
                            }</span></p>
                        </div>
                        <div class="clube-section">
                            <div class="clube-info">
                                <img alt="Escudo" class="escudo-clube"
                                     src="${escudo_src}"
                                     onerror="this.style.display='none'">
                                <span>${atleta["clube"]} - ${atleta.uf}</span>
                            </div>
                            <a href="https://bid.cbf.com.br/atleta-competicoes/${atleta["codigo_atleta"]}"
                               class="btn-historico">VER HISTÓRICO</a>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
};

export async function criarCardAtleta(atleta: Atleta) {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 700 });
    await page.setContent(await createHtml(atleta), { waitUntil: "networkidle0" });

    const element = await page.$(".container");

    const shot = await element?.screenshot();
    await browser.close();

    if (!shot) {
        throw new Error("Failed to capture screenshot");
    }
    return shot;
}
