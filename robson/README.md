# Robson Motta — portfólio

Projeto independente publicado pelo Render a partir da branch `robson-portfolio`. O serviço de Cida continua usando a branch `main`.

## Publicação
Static Site; build `node robson/build.mjs`; saída `robson/dist`; `SKIP_INSTALL_DEPS=true`. O domínio é fornecido automaticamente por `RENDER_EXTERNAL_URL`.

A variável `ROBSON_RETIRO_PHOTO_URL`, configurada no Render, contém o link HTTPS de download da fotografia fornecida pela usuária. O build exige uma resposta PNG válida e publica o arquivo como `assets/robson-no-retiro.png`; o link de origem e os bytes da imagem não são armazenados no repositório.

HTML, CSS e JavaScript ficam em `robson/site`. A construção baixa o retrato institucional, a fachada publicada pela Revista Manchete e a fotografia de Robson no escritório fornecida pela usuária, além das fontes, servindo todos os recursos localmente pelo Render. A fotografia de origem permanece fora do repositório. O livro foi incluído mediante solicitação expressa de disponibilização integral no site para leitura online e download.

## Conteúdo desta primeira versão
A atuação foi conferida no site do Retiro dos Artistas. O contato direciona para https://www.instagram.com/robsonmotta.rj/, conforme indicado pela usuária. A criação da Rede Cultura Social está registrada no RJ1/Globoplay e no Museu da Pessoa. Não foram adicionados cargos, datas, formação, estatísticas ou depoimentos sem fonte.

O currículo anexado e as outras fotografias enviadas na conversa ainda precisam ser incorporados quando estiverem acessíveis. A fotografia de Robson no escritório já foi incorporada por meio do link compartilhado pela usuária. O retrato vem do acervo público do Retiro. A galeria combina a fachada publicada pela Revista Manchete em setembro de 2026 com a fotografia de Robson em seu espaço de trabalho. Os créditos e links constam na página; o build seleciona a maior versão disponibilizada na reportagem e publica as dimensões reais de cada imagem.

Fontes:
- https://revistamanchete.com.br/blog/2026/09/19/o-retiro-dos-artistas-comemora-108-anos-em-grande-estilo/
- https://retirodosartistas.org.br/index.php/transparencia/
- https://retirodosartistas.org.br/
- https://globoplay.globo.com/v/934995/
- https://museudapessoa.org/historia-de-vida/robson-de-souza-ex--menino-de-rua/

A versão inicial não teve revisão visual em navegador. A substituição da fotografia é conferida no site publicado. O build confere imagens, fontes, referências locais, âncoras e sintaxe JavaScript.

## Livro

A página `livro.html` oferece leitura integral de **À procura de uma família**, 2ª edição, Rubi Editorial, 2025. O PDF original está em `robson/site/livros/a-procura-de-uma-familia.pdf` (51 páginas; 11.210.739 bytes; SHA-256 `caff963f222caca4c6d0be1816504c3f125103593535000d35f29c5e53cc6ea9`). A capa é uma renderização da primeira página, respeitando a caixa de corte da edição.

O leitor usa PDF.js 6.5.438, baixado do pacote oficial no build e verificado por SHA-512. Scripts, fontes e decodificadores são servidos pelo próprio site. Navegação por página e capítulos, zoom, seleção de texto, transcrição da página e links diretos para abrir ou baixar o PDF. O sumário do leitor aponta para as páginas efetivas do arquivo, pois algumas referências impressas no sumário original diferem dos inícios dos capítulos. A página principal destaca o livro imediatamente após a abertura.
