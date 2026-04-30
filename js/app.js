const DATE_DISPLAY_OPTIONS = { weekday: 'short', month: 'short', day: 'numeric' }

class SoccerSchedule extends React.Component {
	state = {
		loaded: false,
		defaultStatus: 'SCHEDULED',
		activeState: 'SCHEDULED',
		schedule: [],
		today: new Date,

		selectedStandingsLeague: '',
		standingsData: {}
	}

	// Default status for displayed matches is SCHEDULED
	componentDidMount() {
		this.getMatches(this.state.defaultStatus)
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.activeState !== this.state.activeState) {
			// Update the unique competitions available based on the current tab
        	const currentFiltered = this.state.schedule.filter(match => {
            	if (this.state.activeState === 'SCHEDULED') return ['SCHEDULED', 'TIMED', 'CANCELLED', 'POSTPONED'].includes(match.status)
            	if (this.state.activeState === 'LIVE') return ['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(match.status)
            	if (this.state.activeState === 'FINISHED') return ['FINISHED', 'AWARDED'].includes(match.status)
            	return true
        	})

        	if (currentFiltered.length > 0) {
            	const newDefaultLeague = currentFiltered[0].competition.code

            	this.setState({ 
            		selectedStandingsLeague: newDefaultLeague 
            	})

            	this.getStandings(newDefaultLeague)
        	} 
        	else {
            	// Clear standings if no matches exist in the current tab
            	this.setState({ 
            		standingsData: {}, 
            		selectedStandingsLeague: '' 
            	})
        	}
		}
	}

	getMatches = () => {
		// Show loader during the request
        this.setState({ 
        	loaded: false 
        })

        // Get current date in local timezone to avoid issues with UTC date conversions when obtaining matches for today
		// Get a 2-day window to ensure timezone overlaps are covered
    	const dateFrom = moment().format('YYYY-MM-DD')
    	const dateTo = moment().add(1, 'days').format('YYYY-MM-DD')

		axios({
			// Get ALL matches for the current date once so filtering by status does not require a separate API call each time
			url: `/proxy.php?dateFrom=${dateFrom}&dateTo=${dateTo}`,
			method: 'get'
		}).then(response => {
			if(response.status == 200) {
				// CRITICAL: Filter matches to ONLY those that occur on the user's LOCAL "today"
            	const localToday = moment().format('YYYY-MM-DD')
            	const filteredToLocalDay = response.data.matches.filter(match => {
                	return moment(match.utcDate).local().format('YYYY-MM-DD') === localToday
            	})

            	// Find the first available competition code based on the default tab and show standings for that league
            	const initialFiltered = filteredToLocalDay.filter(match => 
                	['SCHEDULED', 'TIMED', 'CANCELLED', 'POSTPONED'].includes(match.status)
            	)
            	const firstLeagueCode = initialFiltered.length > 0 ? initialFiltered[0].competition.code : ''

				this.setState({
					loaded: true,
					schedule: filteredToLocalDay,
					selectedStandingsLeague: firstLeagueCode
				}, () => {
					// Fetch standings for the first available league
                	if (firstLeagueCode) {
                    	this.getStandings(firstLeagueCode)
                	}
				})
			}
		}).catch(error => {
			console.log(`There was an error retrieving scheduled data: ${error}`)

			// Stop loader on error
			this.setState({ 
				loaded: true 
			})
		})
	}

	getStandings = (competitionCode) => {
		axios({
			// Get standings for selected league
			url: `/proxy-standings.php?comp=${competitionCode}`,
			method: 'get'
		}).then(response => {
			if(response.status == 200) {
				this.setState({
					standingsData: ['CLI'].includes(competitionCode) ? response.data.standings : response.data.standings[0]
				})
			}
		}).catch(error => {
			console.log(`There was an error retrieving standings data: ${error}`)
		})
	}

	handleClick = (event) => {
		event.preventDefault()
		const status = event.target.id.toUpperCase()
		this.setState({
			activeState: status
		})
	}

	handleChange = (leagueCode, name) => {
		this.setState({
			selectedStandingsLeague: leagueCode
		})

		this.getStandings(leagueCode)
	}

	formatClassName = (competition) => {
		return competition.replace(/\s+/g, '-').toLowerCase()
	}

	getStartTime = (utcDate) => {
		// The purpose of this function is to extract the start time for a match from the default format (default format is UTC), then
		// format that time to match the users' locale (such as EST)
		return moment(utcDate).local().format('h:mm A')
	}

	render() {
		const { schedule, activeState, selectedStandingsLeague, standingsData } = this.state

        // Calculate counts for ALL tabs regardless of what is selected
    	const numScheduledMatches = schedule.filter(match => ['SCHEDULED', 'TIMED'].includes(match.status)).length
    	const numLiveMatches = schedule.filter(match => ['IN_PLAY', 'PAUSED'].includes(match.status)).length
    	const numFinishedMatches = schedule.filter(match => match.status === 'FINISHED').length

    	// Filter the matches actually shown based on the active tab
	    const filteredMatches = schedule.filter(match => {
	        if (activeState === 'SCHEDULED') return ['SCHEDULED', 'TIMED', 'CANCELLED', 'POSTPONED'].includes(match.status)
	        if (activeState === 'LIVE') return ['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(match.status)
	        if (activeState === 'FINISHED') return ['FINISHED', 'AWARDED']. includes(match.status)
	        return true
	    })

		// Sort matches strictly by local start time
		const sortedMatches = [...filteredMatches]
								.sort((a, b) => {
									// 1. Create moment objects in local time for both matches
        							const timeA = moment(a.utcDate).local();
        							const timeB = moment(b.utcDate).local();

							        // 2. Compare the unix millisecond timestamps
							        if (timeA.valueOf() !== timeB.valueOf()) {
							            return timeA.valueOf() - timeB.valueOf();
							        }

        							// 3. Fallback: If times are identical, sort alphabetically by league name
        							return a.competition.name.localeCompare(b.competition.name)
								})
								.map((match, index) => (
									<div key={match.id} className={`p-4 col-lg-12 match ${index === 0 ? '' : 'mt-4'}`}>
										<h2 className="d-flex mb-0 pb-3 align-items-center match-league"><img src={match.competition.emblem} className="mr-3 league-logo" alt={match.competition.name} /> {match.competition.name}</h2>
										
										<div className="row m-0">
											<div className="col-12 p-0">
												{(match.status == 'TIMED' || match.status == 'SCHEDULED') && 
													<div className="d-flex mt-4 mb-0">
														<div className="col-4 col-md-2 col-xl-1 pl-0 pr-3 align-self-center">
															<div>{this.getStartTime(match.utcDate)}</div>
														</div>

														<TeamsDisplay match={match} />
													</div>
												}

												{(match.status == 'IN_PLAY' || match.status == 'PAUSED' || match.status == 'FINISHED') && 
													// NOTE: Using the fullTime score which is provided as the source of truth per the API docs,
													// even for live matches currently in play
													<div className="d-flex mt-4 mb-0 match-details">

														<div className="col-4 col-md-2 col-xl-1 pl-0 pr-3 align-self-center">
															<p className={`d-block badge m-0 mb-3 p-2 live-score ${match.status == 'FINISHED' ? 'badge-dark' : 'badge-success'}`}>
																{match.score.fullTime.home}
															</p>
															<p className={`d-block badge m-0 p-2 live-score ${match.status == 'FINISHED' ? 'badge-dark' : 'badge-success'}`}>
																{match.score.fullTime.away}
															</p>
														</div>

														<TeamsDisplay match={match} />
													</div>
												}
											</div>
										</div>
									</div>
								))

		// Show league tables

		// Get unique competition names for select menu display
		// TODO: Try to clean this up
		const seen = new Set()
		const uniqueCompetitions = filteredMatches.filter(match => {
			const duplicate = seen.has(match.competition.code)
  			seen.add(match.competition.code)
  			return !duplicate
		})

		return (
			<React.Fragment>
				<div className="container">
					<h1 className="mt-4 mb-5 text-center h2">Games today: <span className="d-block d-md-inline">{this.state.today.toLocaleDateString(navigator.language, DATE_DISPLAY_OPTIONS)}</span></h1>
					
					<div className="btn-group-filters btn-group btn-group-lg d-block d-md-flex justify-content-md-center mb-5" role="group" aria-label="Match filters">
						<button type="button" id="scheduled" onClick={this.handleClick} 
								className={`btn btn-outline-success match-filter-btn ${this.state.activeState == this.state.defaultStatus ? 'active' : ''}`}>
									Scheduled ({numScheduledMatches})
						</button>
					  	<button type="button" id="live" onClick={this.handleClick} 
					  			className={`btn btn-outline-success match-filter-btn ${this.state.activeState == 'LIVE' ? 'active' : ''}`}>
					  				Live ({numLiveMatches})
					  	</button>
					  	<button type="button" id="finished" onClick={this.handleClick} 
					  			className={`btn btn-outline-success match-filter-btn ${this.state.activeState == 'FINISHED' ? 'active' : ''}`}>
					  				Finished ({numFinishedMatches})
					  	</button>
					</div>
					
					{
						(this.state.schedule.length === 0 || filteredMatches.length === 0) && 
						<p className="text-center">Sorry, there are no available {this.state.activeState.toLowerCase()} matches right now - please try again soon!</p>
					}

					<div className="matches-container">
						<div className="col-12 p-0 pr-lg-4">
							{sortedMatches}
						</div>

						<div className={`px-lg-2 mt-4 mt-lg-0 ${!this.state.loaded || this.state.schedule.length === 0 || filteredMatches.length === 0 ? 'd-none' : ''}`}>
							<div className="dropdown mb-4" id="comp">
								<button 
						            className="btn btn-secondary dropdown-toggle text-left league-dropdown-button" 
						            type="button" 
						            id="leagueDropdownButton" 
						            data-toggle="dropdown" 
						            aria-haspopup="true" 
						            aria-expanded="false"
						        >
						            Select a league:
						        </button>

						        <div className="dropdown-menu" aria-labelledby="leagueDropdownButton">
						            {uniqueCompetitions.map((league, index) => (
						                <button key={index} 
						                    className={`dropdown-item ${selectedStandingsLeague === league.competition.code ? 'active' : ''}`}
						                    type="button"
						                    onClick={() => this.handleChange(league.competition.code, league.competition.name)}
						                >
						                    {league.competition.name}
						                </button>
						            ))}
						        </div>
							</div>
							
							<StandingsTable standings={standingsData} />
						</div>
					</div>

					<p className="text-center mt-5">Football data provided by the <a href="https://www.football-data.org" className="text-success" target="_blank">Football-Data.org API</a></p>
				</div>

				<div className={`position-absolute h-100 w-100 loader-overlay ${this.state.loaded ? 'd-none' : ''}`}>
					<div className="loader-overlay-animation">
						<div className="loader-overlay-animation__ball"></div>
						<p className="text-center text-white loader-overlay-animation__text">Warming up...</p>
					</div>
				</div>
			</React.Fragment>
		) 
	}
}

ReactDOM.render(<SoccerSchedule />, document.getElementById('root'));