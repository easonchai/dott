-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenSignatures" (
    "id" TEXT NOT NULL,
    "signature" JSONB NOT NULL,
    "claimed" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "TokenSignatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTSignatures" (
    "id" TEXT NOT NULL,
    "signature" JSONB NOT NULL,
    "claimed" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,

    CONSTRAINT "NFTSignatures_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TokenSignatures" ADD CONSTRAINT "TokenSignatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSignatures" ADD CONSTRAINT "TokenSignatures_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTSignatures" ADD CONSTRAINT "NFTSignatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTSignatures" ADD CONSTRAINT "NFTSignatures_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
