const bcrypt = require("bcryptjs");
const readline = require("readline/promises");

async function main() {
  const passwordFromArgs = process.argv.slice(2).join(" ");
  let password = passwordFromArgs;

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await rl.question("Admin password to hash: ");
    rl.close();
  }

  if (!password || password.length < 8) {
    console.error("Use a password with at least 8 characters. Use a longer password for production.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error("Unable to hash password.");
  console.error(error.message);
  process.exit(1);
});
