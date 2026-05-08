library( tidyr )
library( dplyr, warn.conflict = FALSE )
library( readr )

argv <- commandArgs( trailingOnly = TRUE ) 

fName <- argv[1]
outfile <- argv[2]

d1 <- read.csv(fName)

simulator_string <- d1$framework[1]

platform <- case_when(
  grepl( "Artistoo", simulator_string, ignore.case = TRUE) ~ "Artistoo",
  grepl( "CC3D", simulator_string, ignore.case = TRUE) ~ "CC3D",
  grepl( "Morpheus", simulator_string, ignore.case = TRUE) ~ "Morpheus"
)

expandDF <- function( dataframe, platform ){
	
	if( platform == "CC3D" ){
		parms <- dataframe %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			separate_wider_delim( fName, delim = "_", 
				names = c( "x",  "Jcm", "Jcc", "lchem", "saturation", "D", "epsilon", "alpha", "seed"  ) ) %>%
			select( Jcc, lchem, saturation, epsilon )
		
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
		
	} else if ( platform == "Artistoo" ){
		parms <- dataframe
		parms$file <- gsub( "angiogenesis-CC3D", "angiogenesisCC3D", parms$file)
		parms$file <- gsub( "angiogenesis-sync", "angiogenesisSync", parms$file)
		parms <- parms %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			separate_wider_delim( fName, delim = "-", 
				names = c( "x",  "T", "Jcm", "Jcc", "D", "alpha","epsilon","saturation","lchem", "seed", "time" ) ) %>%
			select( Jcc, lchem, saturation, epsilon )  %>%
			mutate( across( where(is.character), parse_number )) 
					
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
	
	} else if ( platform == "Morpheus" ){
		
		parms <- dataframe %>% 
			mutate( fName = file ) %>%
			select( fName ) %>%
			mutate( Jcc = 1, saturation = 0.1, lchem = 500, epsilon = 0.3 ) %>%
			separate_wider_delim( fName, delim = "_", 
				names = c( "x", "value", "seed" ) ) %>%
			mutate( value = as.numeric(value))
			
		if( parms$x[1] == "cellcell" ) parms$Jcc <- parms$value 
		else if( parms$x[1] == "chemstrength" ) parms$lchem <-  parms$value 
		else if( parms$x[1] == "satstrength" ) parms$saturation <- parms$value
		else if( parms$x[1] == "vegfdegr" ) parms$epsilon <- parms$value
		else stop( "unknown parameter!" )

		parms <- parms %>%		
			select( Jcc, lchem, saturation, epsilon )
			
		
		metrics <- dataframe 
			
		out <- cbind( parms, metrics ) %>% mutate( platform = platform )
		return(out)
		
	} else {
		stop( "unknown platform!" )
	}
	
}


dd <- expandDF( d1, platform ) %>% mutate( platform = platform ) 

write.csv( dd, file = outfile, quote = FALSE, row.names = FALSE )

