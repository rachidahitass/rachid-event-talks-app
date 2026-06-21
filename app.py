import time
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

CACHE = {
    'data': None,
    'last_updated': 0
}
CACHE_DURATION = 600  # 10 minutes in seconds

def fetch_and_parse_feed():
    url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    r = requests.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    
    root = ET.fromstring(r.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title_el = entry.find('atom:title', ns)
        title = title_el.text if title_el is not None else 'Unknown Date'
        
        updated_el = entry.find('atom:updated', ns)
        updated = updated_el.text if updated_el is not None else ''
        
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        link = link_elem.attrib['href'] if link_elem is not None else ''
        
        id_el = entry.find('atom:id', ns)
        entry_id = id_el.text if id_el is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        items = []
        current_category = None
        current_blocks = []
        
        def flush_item():
            nonlocal current_category, current_blocks
            description = "".join([str(x) for x in current_blocks]).strip()
            if description or current_category:
                items.append({
                    'category': current_category or 'Update',
                    'description': description
                })
        
        for child in soup.contents:
            if child.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                flush_item()
                current_category = child.get_text().strip()
                current_blocks = []
            else:
                current_blocks.append(child)
        flush_item()
        
        if not items and content_html.strip():
            items.append({
                'category': 'Update',
                'description': content_html.strip()
            })
            
        for idx, item in enumerate(items):
            # Clean up the description a bit (ensure links open in new tab and have proper style)
            desc_soup = BeautifulSoup(item['description'], 'html.parser')
            for a_tag in desc_soup.find_all('a'):
                a_tag['target'] = '_blank'
                a_tag['rel'] = 'noopener noreferrer'
            
            entries.append({
                'id': f"{entry_id}#item-{idx}",
                'date': title,
                'updated': updated,
                'link': link,
                'category': item['category'],
                'description': str(desc_soup)
            })
            
    # Extract unique categories
    categories = sorted(list(set(e['category'] for e in entries)))
    
    return {
        'releases': entries,
        'categories': categories,
        'fetched_at': time.time()
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or not CACHE['data'] or (now - CACHE['last_updated']) > CACHE_DURATION:
        try:
            data = fetch_and_parse_feed()
            CACHE['data'] = data
            CACHE['last_updated'] = now
        except Exception as e:
            if CACHE['data']:
                # Return stale data if fetch fails but cache exists
                return jsonify({
                    **CACHE['data'],
                    'warning': f'Failed to refresh feed ({str(e)}). Serving cached version.'
                })
            return jsonify({'error': str(e)}), 500
            
    return jsonify(CACHE['data'])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
