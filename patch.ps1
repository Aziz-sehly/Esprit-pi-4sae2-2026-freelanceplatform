$deployments = @(
    @{name="dispute-service"; container="dispute-service"},
    @{name="contract-service"; container="contract-service"},
    @{name="message-service"; container="message-service"},
    @{name="milestone"; container="milestone"},
    @{name="payment"; container="payment"},
    @{name="service-ms"; container="service-ms"},
    @{name="media-service"; container="media-service"},
    @{name="user-service"; container="user-service"}
)

foreach ($d in $deployments) {
    kubectl set image deployment/$($d.name) -n pidev $($d.container)=faresjebali/pidev_microservices:$($d.name)
    kubectl patch deployment $($d.name) -n pidev --type=json -p="[{`"op`":`"replace`",`"path`":`"/spec/template/spec/containers/0/imagePullPolicy`",`"value`":`"Always`"}]"
    Write-Host "Patched: $($d.name)"
}
