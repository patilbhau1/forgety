import sqlite3
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('tyforge.db')
cursor = conn.cursor()

# Update plan prices
updates = [
    ('basic_plan', 1000),
    ('standard_plan', 5000),
    ('premium_plan', 9000)
]

print("Updating plan prices...")
for plan_id, new_price in updates:
    cursor.execute("UPDATE plans SET price = ? WHERE id = ?", (new_price, plan_id))
    print(f"Updated {plan_id} to {new_price}")

# Commit changes
conn.commit()

# Verify the updates
print("\nVerifying updated prices:")
cursor.execute("SELECT id, name, price FROM plans ORDER BY price ASC")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]} - ₹{row[2]}")

conn.close()
print("\nPrices updated successfully!")
