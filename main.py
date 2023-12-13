import datetime
import functions_framework
import requests
import json
from bs4 import BeautifulSoup
import os

# add all profile urls from all your members here
# future versions will pull this from Firestore

cache = {
    'data': [],
    'ttl': datetime.datetime.now(),
}

@functions_framework.http
def get_badges(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
        <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
    Returns:
        The response json, or any set of values that can be turned into a
        Response object using `make_response`
        <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
    """
    if cache['data'] and cache['ttl'] > datetime.datetime.now():
        return json.dumps(cache['data']), 200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    profile_urls = get_profile_urls()

    payload = []

    for url in profile_urls:
        response = requests.get(url)

        soup = BeautifulSoup(response.text, 'html.parser')

        badges = process_badges(soup)
        user_profile = process_user(soup)

        if user_profile['name'] != '':
            user_payload = {
                'badges': badges,
                'profile': user_profile
            }

            payload.append(user_payload)

    cache['data'] = payload
    # Store a TTL for the data
    date_in_one_hour = datetime.datetime.now() + datetime.timedelta(hours=1)
    cache['ttl'] = date_in_one_hour

    return json.dumps(payload), 200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

def get_profile_urls():
    api_url = os.getenv('GOOGLE_SHEET_API_URL')
    api_key = os.getenv('API_KEY')
    profile_urls_json = requests.get(f'{api_url}&key={api_key}')

    profile_urls = profile_urls_json.json()["values"][0]
    profile_urls = list(set(profile_urls))
    profile_urls = [url for url in profile_urls if url]
    return profile_urls

def process_user(soup):
    user = {
        'name': '',
        'member_since': '',
        'avatar': ''
    }

    try:
        root_container = soup.find('main', attrs={'id': 'jump-content'})
        avatar_container = root_container.find('div', { 'class': 'text--center'})
        user['name'] = avatar_container.find('h1', { 'class': 'ql-display-small'}).text.strip()
        user['member_since'] = avatar_container.find('p', { 'class': 'ql-body-large'}).text.strip()
        user['avatar'] = avatar_container.find('ql-avatar', { 'class': 'l-mbl'})['src']
    except:
        user['avatar'] = 'https://www.gstatic.com/images/branding/product/2x/avatar_anonymous_512dp.png'

    return user

def process_badges(soup):
    profile_badges_container = soup.find('div', attrs={'class': 'profile-badges'})
    profile_badges_list = []

    try:
        profile_badges = profile_badges_container.findAll('div', { 'class': 'profile-badge'})

        for badge in profile_badges:
            badge_dic = {}
            badge_dic['badgeTitle'] = badge.find('span', { 'class': 'ql-title-medium'}).text.strip()
            badge_dic['link'] = badge.find('a', { 'class': 'badge-image'})['href']
            badge_dic['earned'] = badge.find('span', { 'class': 'ql-body-medium'}).text.strip()
            profile_badges_list.append(badge_dic)
    except:
        profile_badges_list = []

    return profile_badges_list
