### **REQUISITOS DO PROJETO**

#### **GIT**

-   Instalar o [GIT](https://www.digitalocean.com/community/tutorials/como-instalar-o-git-no-ubuntu-18-04-inicio-rapido-pt)

#### **NODEJS**

-   Instalar o [NodeJS versão 14](https://nodejs.org/en/download/) para o projeto, sem utilizar o nvm já que o husky não funciona corretamente com o nvm.

**Caso opte por mesmo assim utilizar o nvm terá que desinstalar todas as outras versões (menos a 14) para poder comitar as alterações do projeto.**

#### **YARN**

-   Caso não tenha o yarn instalado utilize o comando:

```
sudo npm install -g yarn
```

## CONFIGURAÇÃO:

-   Configurar arquivos .env\*

### **CONFIGURAÇÕES DE IDE**

#### **INSTALAÇÃO DE PLUGINS**

-   EditorConfig (exemplo no VS Code: EditorConfig for VS Code)
-   ESLint (exemplo no VS Code: ESLint)
-   Prettier (exemplo no VS Code: Prettier - Code formatter)

#### **CONFIGURAÇÃO**

-   Configurar para formatar o código ao salvar o arquivo

#### **VS CODE CONFIGURAÇÃO**

```js
"[javascript]": {
 "editor.defaultFormatter": "esbenp.prettier-vscode"
 },
"editor.formatOnSave": true,
"files.eol": "\n",
"files.watcherExclude": {
 "**/.git/objects/**": true,
 "**/.git/subtree-cache/**": true,
 "**/node_modules/*/**": true
 },
"git.autofetch": true
```

## PADRÕES

-   Nomes no singular: Todas as pastas;
-   Idioma inglês: Todos os nomes, exceto nomes próprios, como seções ou páginas;
-   lowerCamelCase: Nomes de variáveis, funções, métodos - Ex: functionName;
-   UpperCamelCase: Nomes de imports, classes, interfaces, pastas de componentes, arquivos de componentes - Ex: ClassName, Header.js;
-   spinal-case: Nomes no CSS, arquivos no geral, exceto pastas de componentes e arquivos de componentes - Ex: topo-imagem-1.jpg, Header.js;
-   snake_case: Nomes de pastas, exceto pastas de componentes - Ex: folder_name, ComponenteA;

### **CONFIGURAÇÕES DO AMBIENTE**

##### Primeira execução ou sempre que atualizar o package.json

-   Executar no terminal:
    yarn install

#### Ambiente de desenvolvimento, executar no terminal:

-   yarn dev

#### Ambiente de produção, executar no terminal:

-   yarn prod
