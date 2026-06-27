import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-primary-500 text-white py-8 px-6 text-center">
        <Link
          to="/register"
          className="absolute left-6 top-8 text-white text-sm hover:underline"
        >
          ← Voltar ao cadastro
        </Link>
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-sm mt-2 opacity-80">Última atualização: junho de 2026</p>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8 text-gray-700">

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">1. Quem somos?</h2>
          <p className="text-sm leading-relaxed">
            O <strong>MyPiggy</strong> é um sistema web de gestão financeira pessoal desenvolvido
            como projeto acadêmico no curso de Análise e Desenvolvimento de Sistemas do IFSP
            Guarulhos. O sistema permite ao usuário registrar receitas, despesas, gerenciar contas
            e acompanhar metas financeiras de forma manual e segura.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">2. Quais dados coletamos?</h2>
          <p className="text-sm leading-relaxed mb-2">
            No momento do cadastro, coletamos os seguintes dados pessoais:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li><strong>Nome completo</strong> — para identificação e personalização da experiência.</li>
            <li><strong>E-mail</strong> — usado como credencial de acesso ao sistema.</li>
            <li><strong>CPF</strong> — para garantir a unicidade de cada conta cadastrada.</li>
            <li><strong>Senha</strong> — armazenada de forma criptografada (hash BCrypt). Nunca armazenamos sua senha em texto puro.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Futuramente, poderão ser coletados número de celular e data de nascimento, para enriquecer
            o perfil do usuário. Esses campos serão opcionais.
          </p>
          <p className="text-sm leading-relaxed mt-2">
            Os dados financeiros inseridos no sistema (transações, contas, metas) são de <strong>uso
            exclusivo do próprio usuário</strong>. O MyPiggy não realiza integração com instituições
            bancárias, não acessa dados de contas externas e não processa pagamentos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">3. Para que usamos seus dados?</h2>
          <p className="text-sm leading-relaxed mb-2">Os dados coletados são utilizados exclusivamente para:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Criação e gerenciamento da sua conta no MyPiggy.</li>
            <li>Autenticação e controle de acesso seguro ao sistema.</li>
            <li>Personalização da experiência dentro da plataforma.</li>
            <li>Garantir a integridade e unicidade dos dados cadastrados.</li>
          </ul>
          <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-800">
            Seus dados <strong>não são vendidos, compartilhados ou utilizados para fins
            publicitários</strong>. O MyPiggy não envia e-mails de marketing nem repassa
            informações a terceiros.
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">4. Base legal (LGPD)</h2>
          <p className="text-sm leading-relaxed">
            O tratamento dos seus dados é fundamentado no <strong>consentimento</strong> (art. 7º, I
            da Lei nº 13.709/2018 — LGPD): ao se cadastrar e aceitar esta política, você autoriza
            o uso dos seus dados para as finalidades descritas acima. Você pode revogar esse
            consentimento a qualquer momento solicitando a exclusão da sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">5. Por quanto tempo guardamos seus dados?</h2>
          <p className="text-sm leading-relaxed">
            Seus dados são mantidos enquanto sua conta estiver ativa no sistema. Ao solicitar a
            exclusão da conta, todos os dados pessoais e financeiros associados serão permanentemente
            removidos do banco de dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">6. Segurança dos dados</h2>
          <p className="text-sm leading-relaxed">
            Adotamos as seguintes medidas técnicas para proteger suas informações:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2 mt-2">
            <li>Senhas armazenadas com criptografia BCrypt (hash unidirecional).</li>
            <li>Autenticação via token JWT com expiração automática.</li>
            <li>Comunicação entre front-end e back-end protegida por CORS configurado.</li>
            <li>Nenhum dado financeiro é compartilhado com serviços externos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">7. Seus direitos</h2>
          <p className="text-sm leading-relaxed mb-2">
            Conforme a LGPD, você tem direito a:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Acessar os dados que armazenamos sobre você.</li>
            <li>Solicitar a correção de dados incorretos.</li>
            <li>Solicitar a exclusão da sua conta e de todos os dados associados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Por ser um projeto acadêmico em fase de desenvolvimento, o canal de atendimento para
            essas solicitações será disponibilizado nas próximas versões do sistema.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-700 mb-2">8. Alterações nesta política</h2>
          <p className="text-sm leading-relaxed">
            Esta política pode ser atualizada conforme o sistema evolui. Alterações relevantes
            serão comunicadas na própria plataforma. A data de "Última atualização" no topo desta
            página sempre refletirá a versão mais recente.
          </p>
          <p className="text-sm text-gray-400 mt-2">Versão atual: junho de 2026.</p>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-primary-500 text-white text-center py-6 text-xs">
        © 2026 MyPiggy — Projeto Acadêmico IFSP Guarulhos. Todos os direitos reservados.
      </footer>

    </div>
  );
}