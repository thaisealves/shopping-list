import supertest from "supertest";
import app from "../src/app";
import { prisma } from "../src/database";
import itemFactory from "./factories/itemFactory";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "items"`;
});

describe("Testa POST /items ", () => {
  it("Deve retornar 201, se cadastrado um item no formato correto", async () => {
    const item = itemFactory();

    const result = await supertest(app).post(`/items`).send(item);
    const createdItem = await prisma.items.findUnique({
      where: { title: item.title },
    });

    expect(result.status).toBe(201);
    expect(createdItem).not.toBeNull();
  });

  it("Deve retornar 409, ao tentar cadastrar um item que exista", async () => {
    const item = itemFactory();

    await supertest(app).post(`/items`).send(item);
    const result = await supertest(app).post(`/items`).send(item);

    expect(result.status).toBe(409);
  });
});

describe("Testa GET /items ", () => {
  it("Deve retornar status 200 e o body no formato de Array", async () => {
    const item = itemFactory();

    await supertest(app).post(`/items`).send(item);
    const result = await supertest(app).get(`/items`);
    expect(result.body).toBeInstanceOf(Array);
    expect(result.status).toBe(200);
    expect(result.body.length).toBeGreaterThan(0);
  });
});

describe("Testa GET /items/:id ", () => {
  it("Deve retornar status 200 e um objeto igual a o item cadastrado", async () => {
    const item = itemFactory();
    const { body: newItem } = await supertest(app).post(`/items`).send(item);
    const getAll = await supertest(app).get(`/items`);
    const result = await supertest(app).get(`/items/${getAll.body[0].id}`);
    expect(newItem).toMatchObject(result.body);
    expect(result.status).toBe(200);
  });

  it("Deve retornar status 404 caso não exista um item com esse id", async () => {
    const item = itemFactory();
    await supertest(app).post(`/items`).send(item);
    const getAll = await supertest(app).get(`/items`);
    const result = await supertest(app).get(`/items/${getAll.body[0].id - 1}`);
    expect(result.status).toBe(404);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
