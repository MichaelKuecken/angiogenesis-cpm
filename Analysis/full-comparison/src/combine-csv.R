library( dplyr, warn.conflict = FALSE )

argv <- commandArgs( trailingOnly = TRUE ) 
last <- length( argv )
outfile <- argv[last]
csvFiles <- argv[-last]

dd <- bind_rows( lapply( csvFiles, read.csv ) )


write.csv( dd, file = outfile, quote = FALSE, row.names = FALSE )

