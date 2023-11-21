# -*- encoding: utf-8 -*-
'''
First, install the latest release of Python wrapper: $ pip install ovh

To create an API token, visit:
OVH_DNS_DOMAIN=foobar.com
OVH_DNS_RECORD_ID=??????
x-www-browser https://www.ovh.com/auth/api/createToken?GET=/domain/zone/"$OVH_DNS_DOMAIN"/record/"$OVH_DNS_RECORD_ID"&PUT=/domain/zone/"$OVH_DNS_DOMAIN"/record/"$OVH_DNS_RECORD_ID"&POST=/domain/zone/"$OVH_DNS_DOMAIN"/refresh

This should create an API key with the following.
  Add the last one and uncomment the code a few lines
  below to be able to obtain the "$OVH_DNS_RECORD_ID" number.

GET /domain/zone/"$OVH_DNS_DOMAIN"/record/"$OVH_DNS_RECORD_ID"
PUT /domain/zone/"$OVH_DNS_DOMAIN"/record/"$OVH_DNS_RECORD_ID"
POST /domain/zone/"$OVH_DNS_DOMAIN"/refresh
#GET /domain/zone/"$OVH_DNS_DOMAIN"/record
'''
import os
import json
import ovh

# Instanciate an OVH Client.
# You can generate new credentials with full access to your account on
# the token creation page
client = ovh.Client(
    endpoint=os.environ['API_OVH_ENDPOINT'],
    application_key=os.environ['API_OVH_APPLICATION_KEY'],
    application_secret=os.environ['API_OVH_APPLICATION_SECRET'],
    consumer_key=os.environ['API_OVH_CONSUMER_KEY'],
)

# Uncomment to get the OVH_DNS_RECORD_ID number (needs GET /domain/zone/"$OVH_DNS_DOMAIN"/record allowed in the API token)
#result = client.get('/domain/zone/'+os.environ['OVH_DNS_DOMAIN']+'/record',
#    fieldType='TXT',
#    subDomain='_dnslink.git-tutorial',
#)
#print(json.dumps(result, indent=4))

if client.get('/domain/zone/'+os.environ['OVH_DNS_DOMAIN']+'/record/'+os.environ['OVH_DNS_RECORD_ID'])['subDomain'] == '_dnslink.git-tutorial':
    result = client.put('/domain/zone/'+os.environ['OVH_DNS_DOMAIN']+'/record/'+os.environ['OVH_DNS_RECORD_ID'], 
        subDomain='_dnslink.git-tutorial',
        target='dnslink=/ipfs/bafybeigexuwmsjhnitngyacj5ja7nqigddyekkhcsz6ejntrgpwcwtusoy',
        ttl=60,
    )
    print(json.dumps(result, indent=4))

    result = client.post('/domain/zone/'+os.environ['OVH_DNS_DOMAIN']+'/refresh')
    print(json.dumps(result, indent=4))
