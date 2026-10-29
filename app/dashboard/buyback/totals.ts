type Line = { buyPrice: number; sellPrice: number; quantity: number };

// Percent of the buyback value plus a fixed amount in dollars
export type Bonus = { percent: number; amount: number };

export function calculateTotals(lines: Line[], { percent, amount }: Bonus) {
	const subtotal = lines.reduce(
		(sum, line) => sum + line.buyPrice * line.quantity,
		0,
	);
	const bonus = Math.round((subtotal * percent) / 100) + amount;
	const payout = subtotal + bonus;
	const saleValue = lines.reduce(
		(sum, line) => sum + line.sellPrice * line.quantity,
		0,
	);
	const pieces = lines.reduce((sum, line) => sum + line.quantity, 0);
	return {
		subtotal,
		bonus,
		payout,
		saleValue,
		profit: saleValue - payout,
		pieces,
	};
}

// "5% + 10 $", either part left out when zero
export function formatBonus(
	percent: number,
	amount: number,
	price: (amount: number) => string,
) {
	return [
		percent && `${percent.toLocaleString("pl-PL")}%`,
		amount && price(amount),
	]
		.filter(Boolean)
		.join(" + ");
}
