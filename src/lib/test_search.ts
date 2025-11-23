import { searchBooks } from "./hardcover";

async function test() {
  console.log("Testing searchBooks...");
  const results = await searchBooks("fiction");
  console.log("Results count:", results.length);
  if (results.length > 0) {
    console.log("First result:", JSON.stringify(results[0], null, 2));
  } else {
    console.log("No results found.");
  }
}

test();

