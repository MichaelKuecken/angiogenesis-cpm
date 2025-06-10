
argv <- commandArgs( trailingOnly = TRUE )

npar <- as.numeric( argv[1] )
outFile <- argv[2]

parList <- list()

for( i in 1:npar ){
	parVec <- unlist( strsplit( argv[i+2], " " ) )
	parName <- parVec[1]
	parValues <- parVec[-1]
	parList[[parName]] <- parValues
}

parTable <- expand.grid( parList )

write.table( parTable, file= outFile, quote = FALSE, row.names = FALSE, sep="\t" )