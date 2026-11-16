# Portfólio de Cida Cabral

Publicação estática no Render, com contato em https://www.instagram.com/cidacabral/.

## Publicação

- Tipo de serviço: Static Site
- Branch: `main`
- Build command: `node build.mjs`
- Publish directory: `dist`
- Variável: `SKIP_INSTALL_DEPS=true`

O projeto não instala dependências nem utiliza servidor, banco de dados ou serviços pagos.

O script importa os 20 arquivos do portfólio público original durante a construção. Confere as imagens, as fontes, o currículo em PDF, as referências locais e o contato. Atualiza os metadados de compartilhamento para o endereço atribuído pelo Render. Depois da publicação, o conteúdo é servido diretamente pelo Render, sem redirecionar visitantes para o site original.

## Origem e manutenção

Fonte da migração: https://cida-cabral-portfolio.tidystrawberry8.chatgpt.site/

A primeira configuração de publicação depende dessa fonte durante novos builds. Não retire a fonte do ar antes de salvar uma cópia completa dos arquivos na pasta `site/` deste repositório. Quando `site/index.html` estiver presente, o script utilizará exclusivamente essa cópia local.

Para executar fora do Render, informe `SITE_URL` com o endereço HTTPS de destino. No Render, `RENDER_EXTERNAL_URL` fornece esse endereço automaticamente.

O arquivo público `build-info.json` identifica a versão implantada e os hashes dos arquivos para conferência. Alterações no site original só chegam ao Render após uma nova publicação.

Fotografia e currículo fornecidos pela responsável pelo portfólio. Os créditos e as fontes institucionais permanecem na página.
