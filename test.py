
import tweepy

# Replace with your actual credentials
API_KEY = "BwWchwWur8HszcvArHRstzl9s"
API_KEY_SECRET = "TkhKl7l5JgHZiWUw66Lwe7IYrQJagzM5jys9ZxwJETMOVSlNTs"
ACCESS_TOKEN = "1951404646884581379-ggq5UYj9OXeIpIKuf0UVqmGjLuVjvy"
ACCESS_TOKEN_SECRET = "RtwRJJJ6GPAxcPi8LDBKmJgzXlW8tEw5063PKz5KhQ2Hs"

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAOiU3QEAAAAADqBC3HT8k%2F4mfNuLrQmFLTaLXSI%3DOt2b2yYAmLlVky4gXLZ5G5BvOKQRVPlvaSnIc6eoz9ef7SINZN"
CLIENT_ID="QklMTFhxUnFXdi1UMWptRVpoZ0E6MTpjaQ"
CLIENT_SECRET="RfYXJOCIbFCyMPeOaU-qJNtpuaYn3ApAz5GdY5HIRy4nLCoA3Q"


auth = tweepy.OAuth1UserHandler(API_KEY, API_KEY_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api_v1 = tweepy.API(auth)

# Authenticate for v2 (for creating tweets)
client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_KEY_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET
)

media = api_v1.media_upload("teste.png")

try:
    response = client.create_tweet(text="Tweet com imagem", media_ids=[media.media_id])
    print(f"Tweet posted successfully: {response.data['id']}")
except tweepy.TweepyException as e:
    print(f"Error posting tweet: {e}")
