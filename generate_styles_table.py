import csv

input_file = '.shared/ui-ux-pro-max/data/styles.csv'

def generate_markdown_table():
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        print("| UI Brand Tone / Style | Keywords & Vibe | Visual Effects & Animation |")
        print("| :--- | :--- | :--- |")
        
        for row in reader:
            style_name = row['Style Category']
            keywords = row['Keywords'].replace(',', ', ')
            effects = row['Effects & Animation'].replace(',', ', ')
            
            # Clean up extra spaces
            keywords = ' '.join(keywords.split())
            effects = ' '.join(effects.split())
            
            print(f"| **{style_name}** | {keywords} | {effects} |")

if __name__ == "__main__":
    generate_markdown_table()
