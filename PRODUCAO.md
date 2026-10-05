# Publicação

O projeto é estático e não precisa de servidor de aplicação ou instalação de dependências.

Antes da publicação, informe o domínio real executando:

```text
node scripts/configure-domain.cjs https://SEU-DOMINIO
```

O comando preenche canonical nas três páginas, URLs absolutas de Open Graph/Twitter, URL da loja no JSON-LD, sitemap com as três páginas e referência ao sitemap no robots.txt. Enquanto o domínio não for definido, o sitemap permanece preparado e sem URLs fictícias. As imagens sociais relativas precisam desse ajuste para compartilhamento confiável.

Publique `index.html`, `politica-de-privacidade.html`, `termos-de-uso.html`, `robots.txt`, `sitemap.xml`, `css/`, `js/` e os arquivos referenciados em `assets/`. Preserve a estrutura de pastas. Não publique `.qa/`, `tests/`, `scripts/` ou este documento. Fotos JPG antigas e arquivos de referência não utilizados podem ficar fora da publicação; os originais são preservados para manutenção.

Use HTTPS. A hospedagem deve servir `.webp` como `image/webp` e `.woff2` como `font/woff2`. O mapa depende de acesso à rede do Google; caso a hospedagem use Content-Security-Policy, permita `https://www.google.com` em `frame-src`.

Verificação local: `node tests/responsive.cjs` (requer Node e Chrome no Windows). A auditoria confere layout, links oficiais, menu, fontes, imagens, mapa e páginas institucionais. Os endereços de teste locais ficam apenas nos scripts de desenvolvimento e não são usados pelo site publicado.
