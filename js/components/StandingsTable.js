class StandingsTable extends React.Component {
	render() {
		const { standings } = this.props

		return standings && standings.length > 0 ? 
			(
				standings.map((data, index) => (
					<table key={index} className="table">
						<thead className="thead-dark">
							<tr>
								<th scope="col">Pos.</th>
						      	<th scope="col">Team</th>
						      	<th scope="col">Pld</th>
						      	<th scope="col">Pts</th>
							</tr>
						</thead>
						<tbody>
							{data.table.map((innerData, innerIndex) => (
								<tr key={innerIndex} className="bg-white">
									<th scope="row">{data.group} - {data.table[innerIndex].position}</th>
									<td>{data.table[innerIndex].team.shortName ? data.table[innerIndex].team.shortName : data.table[innerIndex].team.name}</td>
									<td>{data.table[innerIndex].playedGames}</td>
									<td>{data.table[innerIndex].points}</td>
								</tr>
							))}
						</tbody>
					</table>
				))
			)	
			: 
			(
				<table className="table">
					<thead className="thead-dark">
						<tr>
							<th scope="col">Pos.</th>
					      	<th scope="col">Team</th>
					      	<th scope="col">Pld</th>
					      	<th scope="col">Pts</th>
						</tr>
					</thead>
					<tbody>
						{standings && typeof(standings) === "object" && standings.table ? 
							standings.table.map((data, index) => (
								<tr key={index} className="bg-white">
									<th scope="row">{data.position}</th>
									<td>{data.team.shortName ? data.team.shortName : data.team.name}</td>
									<td>{data.playedGames}</td>
									<td>{data.points}</td>
								</tr>
							)) 
							: 
							null
						}
					</tbody>
				</table>
			)
	}
}