export type Atleta = {
    id_contrato: string;
    contrato_numero: string;
    tipocontrato: string;
    codigo_atleta: string;
    nome: string;
    apelido: string;
    sexo: string;
    uf: string;
    codigo_clube: string;
    clube: string;
    data_publicacao: string;
    data_nascimento: string;
    datainicio: string | null;
    datatermino: string | null;
};
