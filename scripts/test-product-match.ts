import { matchSameProduct } from "../src/lib/ml/productMatch";

const pairs: [string, string][] = [
  ["Samsung Galaxy S26 Ultra 5G", "S26 Ultra"],
  ["Samsung Galaxy S26 Ultra", "Galaxy S26 Ultra"],
  ["Samsung Galaxy S26 Ultra", "Samsung S26 Ultra"],
  ["Apple iPhone 17 Pro Max", "iPhone 17 Pro Max 256GB"],
  ["Samsung Galaxy S26 Ultra", "Samsung Galaxy A36"],
  ["Samsung Galaxy S26 Ultra", "Samsung Galaxy S26 Plus"],
];

for (const [a, b] of pairs) {
  const m = matchSameProduct(a, b);
  console.log(
    `${m.isSameProduct ? "OK" : "NO"} "${a}" vs "${b}" score=${m.score} models=${m.sharedModelTokens.join(",")}`
  );
}
