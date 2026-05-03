export const buildPagination = (page: any = 1, limit: any = 10) => {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    return { limit: limitNum, offset };
};
