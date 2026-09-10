export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "letreiro.mcpt.workers.dev") {
      url.hostname = "letreiro.marcuscamargo-portfolio.com.br";
      return Response.redirect(url.toString(), 308);
    }

    return env.ASSETS.fetch(request);
  },
};
