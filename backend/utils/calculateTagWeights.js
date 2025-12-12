export function calculateTagWeights(readHistoryTagStats) {
    // Toplam okuma sayısını hesapla
    const total = Object.values(readHistoryTagStats).reduce((a, b) => a + b, 0);

    const weights = {};
    for (const tag in readHistoryTagStats) {
        const percentage = readHistoryTagStats[tag] / total; // Yüzdeyi hesaplama
        weights[tag] = Number(percentage.toFixed(3)); // Üç ondalık basamağa yuvarla
    }
    return weights;
}

export default calculateTagWeights;