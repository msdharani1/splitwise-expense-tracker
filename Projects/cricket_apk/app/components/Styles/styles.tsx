import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderLeftColor: "#0D7D5B", 
    borderRightColor: "#0D7D5B", 
    borderBottomColor: "#0D7D5B", 
    width: "93%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, 
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: "#0D7D5B", 
    borderRadius: 10,
    paddingVertical: 15,
  },
  tabText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "#FFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#0D7D5B",
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, 
  },
  header: {
    backgroundColor: "#0D7D5B",
    padding: 7,
    alignItems: "center",
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20,
    bottom:16
  },
  leagueTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  matchDetails: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 14,
    color: "#444",
  },
  startsIn: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    top:15,
  },
  timer: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  dateTime: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    bottom:10
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  team: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamText: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  teamLogo: {
    width: 30,
    height: 30,
  },
  favouriteSection: {
    backgroundColor: "#EAF3EC",
    width:'109%',
    right:15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 10,
    flexDirection: "row",
    justifyContent:'space-between',
    alignItems: "center",
    top:15
  },
  favouriteText: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 10,
  },
  favouriteChips: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'flex-end'
  },
  chip: {
    backgroundColor: "#D9E4D7",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  scoreBox: {
    paddingHorizontal: 20,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 5,
  },
  greenBox: {
    backgroundColor: "#0D7D5B",
  },
  redBox: {
    backgroundColor: "#D9534F",
  },
  scoreText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  comingSoon: {
    marginTop: 20,
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 20,
    color: "gray",
  },
});

export default styles;
