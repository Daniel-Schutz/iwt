export async function getIModel3dTilesUrl(iModelId: string, accessToken: string): Promise<URL | undefined> {
  console.log("Fazendo chamada para API com iModelId:", iModelId);
  
  const headers = {
    "Authorization": accessToken, // O token já vem com o prefixo "Bearer"
    "Accept": "application/vnd.bentley.itwin-platform.v1+json",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  console.log("Headers configurados:", JSON.stringify(headers, null, 2));

  const url = `https://api.bentley.com/mesh-export/?iModelId=${iModelId}&exportType=3DTILES`;
  console.log("URL da API:", url);

  try {
    const response = await fetch(url, { headers });
    console.log("Status da resposta:", response.status);
    const responseJson = await response.json();
    
    if (responseJson.error) {
      console.error("Erro da API:", responseJson.error);
      throw new Error(responseJson.error);
    }

    // Get the first export from the response, if it exists
    const exportItem = responseJson.exports?.shift();
    if (exportItem) {
      const tilesetUrl = new URL(exportItem._links.mesh.href);
      tilesetUrl.pathname = tilesetUrl.pathname + "/tileset.json";
      console.log("URL do tileset obtida:", tilesetUrl.toString());
      return tilesetUrl;
    } else {
      console.log("Nenhum export encontrado na resposta");
      return undefined;
    }
  } catch (error) {
    console.error("Erro ao fazer chamada para API:", error);
    throw error;
  }
}
