# 🐷 MyPiggy — Sistema Web de Gestão Financeira Pessoal

Trabalho de Conclusão de Curso — Análise e Desenvolvimento de Sistemas  
IFSP Guarulhos | Desenvolvido por **Eytor Lima**

---

## 📋 Sobre o Projeto

O MyPiggy é uma plataforma web de gestão financeira pessoal que permite ao usuário:

- Registrar e categorizar receitas, despesas e transferências
- Gerenciar múltiplas contas e carteiras
- Criar cofrinhos (PiggyBank) com metas de economia
- Definir orçamentos por categoria
- Visualizar relatórios e gráficos financeiros mensais
- Exportar relatórios em `.csv` e `.pdf`

---

## 🛠️ Stack Tecnológica

### Front-End
- React.js + JavaScript (ES6+)
- TailwindCSS
- React Router DOM
- Axios
- React Hook Form + Zod
- Recharts

### Back-End
- Java 17 + Spring Boot 3
- Spring Security + JWT
- Spring Data JPA + Hibernate
- PostgreSQL
- Flyway (migrations)

---

## 📁 Estrutura do Repositório

```
mypiggy/
├── backend/     ← API REST (Spring Boot)
├── frontend/    ← Interface Web (React)
└── README.md
```

---

## ⚙️ Pré-requisitos

- Java 17+
- Node.js 18+
- PostgreSQL 15+ instalado e rodando localmente
- Maven 3.8+

---

## 🚀 Como Rodar Localmente

### Banco de Dados

1. Crie o banco no PostgreSQL:
```sql
CREATE DATABASE mypiggy;
```

2. Configure as credenciais em `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mypiggy
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

> As migrations Flyway criam as tabelas automaticamente ao iniciar o back-end.

---

### Back-End

```bash
cd backend
mvn spring-boot:run
```

API disponível em: `http://localhost:8080`

---

### Front-End

```bash
cd frontend
npm install
npm run dev
```

Interface disponível em: `http://localhost:5173`

---

## 🔀 Branches

| Branch       | Finalidade                              |
|--------------|-----------------------------------------|
| `main`       | Código estável (apenas via PR)          |
| `develop`    | Integração contínua das features        |
| `feature/*`  | Desenvolvimento de tarefas individuais  |

---

## 📌 Status do Projeto

🚧 Em desenvolvimento — Sprint 1

---

## 📄 Licença

Projeto acadêmico. Todos os direitos reservados ao autor.
