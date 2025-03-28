# Dummy Rollup Deploy

## Local Dev

```
$ docker compose up
```

If you see this error:
```
error acting as staker                   
err="error advancing stake from node 2 (hash 0xee288c5dcc61206e6868fa7a01da6abaabe22d6c849718a47eb361857b7e8dd8): error generating node action: block validation is still pending"
```
This error is expected when running a newly deployed rollup with no recent activity. It occurs because there are no new nodes to stake on or no new batches have been posted. Simply let the system continue running.


## Testing the Chain

To verify your chain is running correctly:

Check Confirmed Nodes by the Validator/Staker

```
cast call --rpc-url https://arbitrum-sepolia-rpc.publicnode.com 0xc9A884B4F5440fc00730A52ab48a8e0Db8b30784 "latestConfirmed()(uint256)"
```

Test bridge functionality:

```
cast send --rpc-url https://arbitrum-sepolia-rpc.publicnode.com 0x0EB750129705fAfec85B0b1BF17B3c8bA3504602 'depositEth() external payable returns (uint256)' --private-key $YOUR_PRIVATE_KEY  --value 10000000000 -vvvv
```
Note: Bridging transactions can take up to 15 minutes to finalize.

Verify your balance:

```
cast balance $YOUR_PUBLIC_ADDRESS --rpc-url http://127.0.0.1:8547
```

Test sending transactions:

```
cast send $ANY_ADDRESS --value 1 --private-key $YOUR_PRIVATE_KEY --rpc-url http://127.0.0.1:8547
```

For a more consistent test, you can also continuously send transactions to the rollup. This approach simulates a more realistic environment by continually submitting transactions, allowing you to see how the system handles ongoing activity. (See the next section for details.)

Check recipient balance:

```
cast balance $ANY_ADDRESS --rpc-url http://127.0.0.1:8547
```

If successful, the recipient's balance should show 1 wei or the amount you sent if different.
