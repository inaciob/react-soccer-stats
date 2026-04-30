class TeamsDisplay extends React.Component {
	render() {
		const { match } = this.props

		return (
			<div className="col-8 col-md-10 col-xl-11 pr-0 pl-3 match-details--teams">
				<p className="d-flex w-100 mb-3 align-items-center">
					<img src={match.homeTeam.crest} className="mr-2 team-crest" alt={match.homeTeam.shortName} /> 
					{match.homeTeam.name}
				</p> 
				<p className="d-flex w-100 mb-0 align-items-center">
					<img src={match.awayTeam.crest} className="mr-2 team-crest" alt={match.awayTeam.shortName} /> 
					{match.awayTeam.name}
				</p>
			</div>
		)
	}
}