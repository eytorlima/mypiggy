import api from "./api";

export async function getMonthlySummary() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const response = await api.get(`/transactions/sumarry?month=${month}&year=${year}`);

    return response.data.data;
}