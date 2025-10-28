import fastf1.ergast as ergast
from fastf1.ergast.interface import ErgastInvalidRequestError
import datetime

# Get the current year to fetch the latest standings
current_year = datetime.datetime.now().year

try:
    # Initialize the Ergast API client
    client = ergast.Ergast()

    # Explicitly get the driver standings for the current season
    standings = client.get_driver_standings(season=current_year)

    if standings.content:
        driver_standings = standings.content[0]

        # Print the leaderboard
        print(f"F1 World Drivers' Championship Standings ({current_year}):")
        print(driver_standings[['position', 'points', 'wins', 'givenName', 'familyName']])
    else:
        print(f"Could not find standings for the {current_year} season.")

except ErgastInvalidRequestError as e:
    print(f"Error fetching data from the API: {e}")
    print("This might be because the season has not started or data is not yet available.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

