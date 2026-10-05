"use strict";

/* Links oficiais da loja, centralizados para facilitar futuras atualizacoes. */
const contatos = {
  whatsapp: "https://wa.me/5548999806764?text=Ol%C3%A1!%20Vim%20pelo%20link%20do%20Site%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.",
  instagram: "https://www.instagram.com/luardeveraobeachwear/",
  maps: "https://maps.app.goo.gl/zMQEsFzRRy5HFf9a8"
};

/* EDITE SEU CATÁLOGO AQUI.
   Troque nome, imagem, descrição e link. Você pode adicionar outros objetos.
   As fotos são referências temporárias, não fotografias das peças da loja.
   Use link: "https://..." para o canal externo de cada categoria.
   Um link vazio usa o WhatsApp da loja, quando configurado. */
const categorias = [
  { nome: "Biquínis", imagem: "assets/images/biquinis.webp", descricao: "Sol, mar e liberdade em cada detalhe.", link: "" },
  { nome: "Maiôs", imagem: "assets/images/maios-editorial.webp", descricao: "Elegância para mergulhar no seu estilo.", link: "" },
  { nome: "Saídas de Praia", imagem: "assets/images/saidas-editorial.webp", descricao: "Leveza que vai além da beira do mar.", link: "" },
  { nome: "Vestidos", imagem: "assets/images/vestidos.webp", descricao: "Movimento e charme para dias solares.", link: "" },
  { nome: "Moda Masculina", imagem: "assets/images/masculina-editorial.webp", descricao: "Conforto para aproveitar cada onda.", link: "" },
  { nome: "Acessórios", imagem: "assets/images/acessorios-editorial.webp", descricao: "Pequenos detalhes. Muito verão.", link: "" }
];

// Aceita somente links HTTP/HTTPS para os destinos externos.
function linkSeguro(valor) {
  try {
    const url = new URL(valor);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function linkWhatsApp() {
  return linkSeguro(contatos.whatsapp);
}

// Cria os elementos com textContent para manter a edição de textos segura.
const grid = document.querySelector("#category-grid");
categorias.forEach((categoria, indice) => {
  // Um único link envolve todo o card: foto, nome e ação são clicáveis.
  const card = document.createElement("a");
  card.className = "category-card reveal";
  const foto = document.createElement("div");
  foto.className = "category-photo";
  const imagem = document.createElement("img");
  imagem.src = categoria.imagem;
  imagem.alt = `Imagem ilustrativa da categoria ${categoria.nome}`;
  imagem.loading = "lazy";
  imagem.width = 800;
  imagem.height = 900;
  // Se a foto temporária falhar, mantém um espaço visual agradável.
  imagem.addEventListener("error", () => { imagem.hidden = true; });
  const numero = document.createElement("span");
  numero.className = "category-number";
  numero.textContent = String(indice + 1).padStart(2, "0");
  foto.append(imagem, numero);
  const corpo = document.createElement("div");
  corpo.className = "category-body";
  const titulo = document.createElement("h3");
  titulo.textContent = categoria.nome;
  const descricao = document.createElement("p");
  descricao.textContent = categoria.descricao;
  const link = document.createElement("span");
  link.className = "category-link";
  link.textContent = "Ver Categoria";
  card.setAttribute("aria-label", `Ver categoria ${categoria.nome} (abre em nova aba)`);
  const seta = document.createElement("span");
  seta.textContent = "→";
  seta.setAttribute("aria-hidden", "true");
  link.append(seta);
  const destino = linkSeguro(categoria.link) || linkWhatsApp();
  if (destino) {
    card.href = destino;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
  } else {
    card.href = "#contato";
    card.setAttribute("aria-label", `Consultar disponibilidade de ${categoria.nome} na seção de contato`);
  }
  corpo.append(titulo, descricao, link);
  card.append(foto, corpo);
  grid.append(card);
});

// Centraliza os links de contato sem precisar alterar o HTML.
document.querySelectorAll("[data-contact]").forEach(link => {
  const destino = linkSeguro(contatos[link.dataset.contact]);
  if (destino) {
    link.href = destino;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  else {
    link.href = "#contato";
    link.removeAttribute("target");
    link.addEventListener("click", () => { document.querySelector("#contact-status").hidden = false; });
  }
});
if (!linkWhatsApp() && !linkSeguro(contatos.instagram)) document.querySelector("#contact-status").hidden = false;

// Mostra a marca em texto se as logos locais ainda não foram adicionadas.
document.querySelectorAll(".brand-image").forEach(imagem => {
  const fallback = () => {
    imagem.hidden = true;
    imagem.nextElementSibling.hidden = false;
  };
  imagem.addEventListener("error", fallback);
  if (imagem.complete && imagem.naturalWidth === 0) fallback();
});

const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu");
function fecharMenu() {
  menu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
}
menuToggle.addEventListener("click", () => {
  const aberto = menu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(aberto));
  menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
});
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", fecharMenu));
document.addEventListener("keydown", evento => {
  if (evento.key === "Escape" && menu.classList.contains("is-open")) {
    fecharMenu();
    menuToggle.focus();
  }
});
document.addEventListener("click", evento => {
  if (!evento.target.closest(".header")) fecharMenu();
});
window.matchMedia("(min-width: 769px)").addEventListener("change", evento => { if (evento.matches) fecharMenu(); });

// Revelação discreta: conteúdo permanece visível sem suporte à API.
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.remove("is-pending");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(elemento => {
    elemento.classList.add("is-pending");
    observador.observe(elemento);
  });
}
// Copyright institucional informado pela loja: 2027.

// Atualiza os atalhos ao rolar, sem listeners contínuos de scroll.
if ("IntersectionObserver" in window) {
  const atalhos = [...document.querySelectorAll('.bottom-nav a:not([data-contact])')];
  const navegacao = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      atalhos.forEach(link => {
        const ativo = link.hash === `#${entrada.target.id}`;
        link.classList.toggle('is-active', ativo);
        if (ativo) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
  document.querySelectorAll('main > section[id]').forEach(secao => navegacao.observe(secao));
}
